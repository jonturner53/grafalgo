SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../include
LDIR := ../../lib
BIN := ~/bin
WARN := -Wall -Wno-c++11-extensions
CXXFLAGS := ${WARN} ${ARCH} -O2

HFILES = ${IDIR}/Adt.h ${IDIR}/Djsets_cl.h \
	${IDIR}/Djheaps_l.h ${IDIR}/Djheaps_ll.h ${IDIR}/Djheaps_f.h 
OFILES = Djheaps_l.o Djheaps_ll.o Djheaps_f.o 
${OFILES} : ${HFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all :	${OFILES}
	ar -ru ${LDIR}/lib-ds.a ${OFILES}

clean:
	rm -f *.o
