SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
BIN := ~/bin
WARN := -Wall -Wno-c++11-extensions
CXXFLAGS := ${WARN} ${ARCH} -O2

HFILES = ${IDIR}/Hash.h
OFILES = Hash.o 
${OFILES} : ${HFILES}

.cpp.o : 
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all : ${OFILES}
	ar -ru ${LDIR}/lib-ds.a ${OFILES}

clean :
	make -C unit clean
	rm -f *.o
