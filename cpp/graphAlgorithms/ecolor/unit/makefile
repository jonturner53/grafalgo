SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../../include
LDIR := ../../../lib
BIN := ~/bin
WARN := -Wall
CXXFLAGS := ${WARN} ${ARCH} -O2 -std=c++0x

LIBGA := ${LDIR}/lib-ga.a
LIBS := ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

HFILES = ${IDIR}/stdinc.h 
XFILES = testColor timeColor

${OFILES} : ${HFILES}

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all:	${XFILES}

testColor: testColor.o ${LIBS} ${LIBGA}
	${CXX} ${CXXFLAGS} $< ${LIBGA} ${LIBS} -o $@

timeColor: timeColor.o ${LIBS} ${LIBGA}
	${CXX} ${CXXFLAGS} $< ${LIBGA} ${LIBS} -o $@

clean:
	rm -f *.o ${XFILES}
