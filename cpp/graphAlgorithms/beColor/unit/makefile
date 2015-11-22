SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
IDIR := ../../../include
LDIR := ../../../lib
BIN := ~/bin
WARN := -Wall
CXXFLAGS := ${WARN} ${ARCH} -O2 -std=c++0x

LIBS := ${LDIR}/lib-ga.a ${LDIR}/lib-ds.a ${LDIR}/lib-util.a

XFILES = testBecolor evalBecolor badCase

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all:	${XFILES}

testBecolor: testBecolor.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

evalBecolor: evalBecolor.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

badCase: badCase.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

clean:
	rm -f *.o ${XFILES}
